import type { ImageSourcePropType } from 'react-native';

// 펫 시트 require 표는 scripts/build-pet-assets.mjs가 원본 폴더로 만든다
export { PET_PORTRAITS, PET_SHEETS } from './petAssets.generated';

export const PROPS_SHEET: ImageSourcePropType = require('../../../assets/pets/props.png');
export const BACKGROUND_TILE: ImageSourcePropType = require('../../../assets/pets/background_tile.png');
export const ROOM_BACKGROUND_TILE: ImageSourcePropType = require('../../../assets/pets/room_background_tile.png');
export const DRILL_SHEET: ImageSourcePropType = require('../../../assets/pets/attendance_drill_sequence.png');
