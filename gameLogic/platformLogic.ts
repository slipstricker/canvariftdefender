
import { Platform } from '../types';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_JUMP_HEIGHT, PLAYER_MOVEMENT_SPEED, GRAVITY,
    DYNAMIC_PLATFORM_COUNT, PLATFORM_MIN_WIDTH_FACTOR,
    PLATFORM_SAFE_SPAWN_ATTEMPTS,
    GROUND_PLATFORM_HEIGHT, DYNAMIC_PLATFORM_HEIGHT, DEFAULT_PLATFORM_PADDING,
    PLAYER_WIDTH, PLAYER_HEIGHT
} from '../constants';

interface ZoneHint {
  minX: number;
  maxX: number;
  type: string; // e.g., 'SECTOR_0', 'SECTOR_1'
}

// Define 4 sectors
const SECTOR_COUNT = 4;
const SECTOR_WIDTH = CANVAS_WIDTH / SECTOR_COUNT;
const SECTORS: ZoneHint[] = Array.from({ length: SECTOR_COUNT }, (_, i) => ({
    minX: i * SECTOR_WIDTH + (i === 0 ? DEFAULT_PLATFORM_PADDING : 0),
    maxX: (i + 1) * SECTOR_WIDTH - (i === SECTOR_COUNT - 1 ? DEFAULT_PLATFORM_PADDING : 0),
    type: `SECTOR_${i}`,
}));


const initializePlatforms = (): Platform[] => {
  const platforms: Platform[] = [];
  // Ground floor (static)
  platforms.push({
    id: 'ground',
    x: 0,
    y: CANVAS_HEIGHT - GROUND_PLATFORM_HEIGHT,
    width: CANVAS_WIDTH,
    height: GROUND_PLATFORM_HEIGHT,
    originalWidth: CANVAS_WIDTH,
    isVisible: true,
    isBlinkingOut: false,
    blinkTimer: Infinity,
    currentAlpha: 1,
  });

  // Dynamic platforms
  for (let i = 0; i < DYNAMIC_PLATFORM_COUNT; i++) {
    const originalWidth = (100 + Math.random() * 100) * 0.9;
    platforms.push({
      id: `dynamic-${i}`,
      x: -CANVAS_WIDTH, // Initially off-screen
      y: -CANVAS_HEIGHT, // Initially off-screen
      width: originalWidth * (PLATFORM_MIN_WIDTH_FACTOR + Math.random() * (1 - PLATFORM_MIN_WIDTH_FACTOR)),
      height: DYNAMIC_PLATFORM_HEIGHT,
      originalWidth: originalWidth,
      isVisible: false,
      isBlinkingOut: false,
      blinkTimer: 0,
      currentAlpha: 0,
    });
  }
  return platforms;
};

export const PLATFORMS: Platform[] = initializePlatforms();


export function getHighestPlatformY(platforms: Platform[]): number {
  if (!platforms || platforms.length === 0) {
    return CANVAS_HEIGHT;
  }
  const visiblePlatforms = platforms.filter(p => p.isVisible);
  if (visiblePlatforms.length === 0) return CANVAS_HEIGHT;
  return Math.min(...visiblePlatforms.map(p => p.y));
}

function isOverlapping(platform1: Platform, platform2: Platform, padding = DYNAMIC_PLATFORM_HEIGHT * 0.5): boolean {
    // Reduce padding for initial placement to allow slightly closer platforms if necessary,
    // especially for horizontal checks. Vertical checks are more strict.
    const horizontalPadding = PLAYER_WIDTH * 0.1;
    const verticalPadding = DYNAMIC_PLATFORM_HEIGHT * 0.25;

    return platform1.x < platform2.x + platform2.width + horizontalPadding &&
           platform1.x + platform1.width + horizontalPadding > platform2.x &&
           platform1.y < platform2.y + platform2.height + verticalPadding &&
           platform1.y + platform1.height + verticalPadding > platform2.y;
}


export function findNewPlatformPositionAndSize(
    platformToUpdate: Platform,
    anchorPlatform: Platform,
    isAnchoredToGround: boolean,
    existingPlacedPlatforms: Platform[],
    targetXZoneHint: ZoneHint
): { x: number; y: number; width: number } {
    const newWidth = platformToUpdate.originalWidth * (PLATFORM_MIN_WIDTH_FACTOR + Math.random() * (1 - PLATFORM_MIN_WIDTH_FACTOR));
    let newX = 0;
    let newY = 0;
    let foundPosition = false;

    // Vertical jump constraints (top of anchor to top of new platform, always upwards from anchor)
    let minVerticalTopSeparationUp: number;
    let maxVerticalTopSeparationUp: number;

    if (isAnchoredToGround) {
        minVerticalTopSeparationUp = PLAYER_HEIGHT * 1.1;
        maxVerticalTopSeparationUp = PLAYER_HEIGHT * 1.3;
    } else {
        minVerticalTopSeparationUp = PLAYER_HEIGHT * 0.80;
        maxVerticalTopSeparationUp = PLAYER_HEIGHT * 1.1;
    }

    // Horizontal edge gap constraints
    const minHorizontalEdgeGap = PLAYER_WIDTH * 0.40; 
    const maxHorizontalEdgeGap = PLAYER_WIDTH * 1.20;

    // Global Y limits for platform tops
    const GLOBAL_MIN_Y_ALLOWED_FOR_PLATFORM_TOP = CANVAS_HEIGHT * 0.20; 
    const GLOBAL_MAX_Y_ALLOWED_FOR_PLATFORM_TOP = CANVAS_HEIGHT - GROUND_PLATFORM_HEIGHT - DYNAMIC_PLATFORM_HEIGHT - (PLAYER_HEIGHT * 0.1);

    for (let attempt = 0; attempt < PLATFORM_SAFE_SPAWN_ATTEMPTS; attempt++) {
        // Vertical Placement: Always upwards from anchor's top
        let randomVerticalTopSeparation = minVerticalTopSeparationUp + Math.random() * (maxVerticalTopSeparationUp - minVerticalTopSeparationUp);
        let proposedNewY = anchorPlatform.y - randomVerticalTopSeparation;
        
        // Apply global canvas Y constraints
        newY = Math.max(GLOBAL_MIN_Y_ALLOWED_FOR_PLATFORM_TOP, Math.min(proposedNewY, GLOBAL_MAX_Y_ALLOWED_FOR_PLATFORM_TOP));

        // Horizontal placement
        let randomHorizontalEdgeOffset = minHorizontalEdgeGap + Math.random() * (maxHorizontalEdgeGap - minHorizontalEdgeGap);
        const preferRightFromAnchor = Math.random() < 0.5;
        
        let proposedX_from_anchor: number;
        if (isAnchoredToGround) {
            // If anchored to ground, place randomly within the sector horizontally
            proposedX_from_anchor = targetXZoneHint.minX + Math.random() * (targetXZoneHint.maxX - targetXZoneHint.minX - newWidth);
        } else {
            // If anchored to a dynamic platform, place relative to it
            if (preferRightFromAnchor) {
                proposedX_from_anchor = anchorPlatform.x + anchorPlatform.width + randomHorizontalEdgeOffset;
            } else {
                proposedX_from_anchor = anchorPlatform.x - newWidth - randomHorizontalEdgeOffset;
            }
        }
        newX = proposedX_from_anchor; 

        // Clamp to target X Zone
        newX = Math.max(targetXZoneHint.minX, Math.min(newX, targetXZoneHint.maxX - newWidth));
        
        // If not anchored to ground, re-check and enforce horizontal gap from anchor AFTER zone clamping
        if (!isAnchoredToGround) {
            let actualHorizontalGapFromAnchor;
            if (newX > anchorPlatform.x + anchorPlatform.width) { // New platform is to the right of anchor
                actualHorizontalGapFromAnchor = newX - (anchorPlatform.x + anchorPlatform.width);
                if (actualHorizontalGapFromAnchor > maxHorizontalEdgeGap) {
                    newX = anchorPlatform.x + anchorPlatform.width + maxHorizontalEdgeGap;
                } else if (actualHorizontalGapFromAnchor < minHorizontalEdgeGap) {
                    newX = anchorPlatform.x + anchorPlatform.width + minHorizontalEdgeGap;
                }
            } else { // New platform is to the left of anchor
                actualHorizontalGapFromAnchor = anchorPlatform.x - (newX + newWidth);
                if (actualHorizontalGapFromAnchor > maxHorizontalEdgeGap) {
                    newX = anchorPlatform.x - newWidth - maxHorizontalEdgeGap;
                } else if (actualHorizontalGapFromAnchor < minHorizontalEdgeGap) {
                    newX = anchorPlatform.x - newWidth - minHorizontalEdgeGap;
                }
            }
            // Re-clamp to zone after anchor adjustment, then to canvas
            newX = Math.max(targetXZoneHint.minX, Math.min(newX, targetXZoneHint.maxX - newWidth));
        }
        
        // Final clamp to canvas boundaries overall
        newX = Math.max(DEFAULT_PLATFORM_PADDING, Math.min(newX, CANVAS_WIDTH - newWidth - DEFAULT_PLATFORM_PADDING));


        const tempPlatform: Platform = { 
            ...platformToUpdate, 
            x: newX, y: newY, 
            width: newWidth, height: DYNAMIC_PLATFORM_HEIGHT,
            isVisible: true, currentAlpha: 1 
        };

        let overlaps = false;
        for (const p of existingPlacedPlatforms) {
            if (p.id === platformToUpdate.id) continue; 
            // Do not allow overlap with the direct anchor unless it's ground (which is very large)
            if (p.id === anchorPlatform.id && anchorPlatform.id !== 'ground') continue; 
            if (isOverlapping(tempPlatform, p)) {
                overlaps = true;
                break;
            }
        }
        if (!overlaps) {
            foundPosition = true;
            break;
        }
    }

    if (!foundPosition) { 
        newY = GLOBAL_MIN_Y_ALLOWED_FOR_PLATFORM_TOP + Math.random() * (GLOBAL_MAX_Y_ALLOWED_FOR_PLATFORM_TOP - GLOBAL_MIN_Y_ALLOWED_FOR_PLATFORM_TOP);
        newX = targetXZoneHint.minX + Math.random() * (targetXZoneHint.maxX - targetXZoneHint.minX - newWidth);
        newX = Math.max(DEFAULT_PLATFORM_PADDING, Math.min(newX, CANVAS_WIDTH - newWidth - DEFAULT_PLATFORM_PADDING));
    }

    return { x: newX, y: newY, width: newWidth };
}

export function repositionAndResizeAllDynamicPlatforms(currentPlatforms: Platform[]): Platform[] {
    const groundPlatform = currentPlatforms.find(p => p.id === 'ground');
    if (!groundPlatform) {
        console.error("Ground platform not found during repositioning!");
        return currentPlatforms;
    }
    const GPN: Platform = { 
        ...groundPlatform,
        height: GROUND_PLATFORM_HEIGHT,
        y: CANVAS_HEIGHT - GROUND_PLATFORM_HEIGHT,
        isVisible: true,
        currentAlpha: 1,
        originalWidth: CANVAS_WIDTH,
        width: CANVAS_WIDTH,
    };

    const finalPlacedPlatforms: Platform[] = [GPN];
    const dynamicPlatformSpecsToPlace = currentPlatforms
        .filter(p => p.id !== 'ground')
        .map(p => ({ ...p, height: DYNAMIC_PLATFORM_HEIGHT }));

    const PLATFORMS_PER_SECTOR = 3;

    for (let i = 0; i < DYNAMIC_PLATFORM_COUNT; i++) {
        const platformSpec = dynamicPlatformSpecsToPlace[i] || {
            id: `dynamic-gen-${i}`, x: -CANVAS_WIDTH, y: -CANVAS_HEIGHT,
            width: (100 + Math.random() * 50) * 0.9,
            originalWidth: (100 + Math.random() * 100) * 0.9,
            height: DYNAMIC_PLATFORM_HEIGHT, isVisible: false, currentAlpha: 0, isBlinkingOut: false, blinkTimer: 0
        };

        const currentSectorIndex = Math.floor(i / PLATFORMS_PER_SECTOR);
        const platformIndexWithinSector = i % PLATFORMS_PER_SECTOR;
        const targetZoneForSector = SECTORS[currentSectorIndex % SECTORS.length];

        let anchorPlatform: Platform;
        let isAnchoredToGround: boolean;

        if (platformIndexWithinSector === 0) { // First platform of a new sector grouping
            anchorPlatform = GPN;
            isAnchoredToGround = true;
        } else {
            // Find dynamic platforms already placed *in the current sector*.
            const dynamicPlatformsInCurrentSector = finalPlacedPlatforms.filter(p => {
                if (p.id === 'ground') return false;
                // Check if platform p's center falls within the current target sector's X boundaries
                const pMidX = p.x + p.width / 2;
                return pMidX >= targetZoneForSector.minX && pMidX <= targetZoneForSector.maxX;
            });

            if (dynamicPlatformsInCurrentSector.length > 0) {
                // Anchor to the highest (lowest y-value) platform among those.
                anchorPlatform = dynamicPlatformsInCurrentSector.reduce((prev, curr) => (prev.y < curr.y ? prev : curr));
                isAnchoredToGround = false;
            } else {
                // Fallback: if no dynamic platform found in this sector (should only happen if logic error or first in sector handled incorrectly)
                anchorPlatform = GPN;
                isAnchoredToGround = true;
            }
        }
        
        const { x, y, width } = findNewPlatformPositionAndSize(
            platformSpec,
            anchorPlatform,
            isAnchoredToGround,
            finalPlacedPlatforms,
            targetZoneForSector
        );

        const newDynamicPlatform: Platform = {
            ...platformSpec, id: platformSpec.id,
            x, y, width,
            isVisible: true, currentAlpha: 1, isBlinkingOut: false, blinkTimer: 0
        };
        finalPlacedPlatforms.push(newDynamicPlatform);
    }
    
    const finalDynamicPlatforms = finalPlacedPlatforms.filter(p => p.id !== 'ground').slice(0, DYNAMIC_PLATFORM_COUNT);
    
    return [GPN, ...finalDynamicPlatforms.map((p, index) => ({
        ...p,
        id: dynamicPlatformSpecsToPlace[index]?.id || p.id 
    }))];
}


export function updateDynamicPlatforms(
    platformsToUpdate: Platform[],
    deltaTime: number
): Platform[] {
  // Current implementation does not change platforms during gameplay, only on wave intermission.
  return platformsToUpdate;
}
