import type { ImageSourcePropType } from 'react-native';

// require는 정적이어야 해서 색마다 적어 둔다 (scripts/build-pet-assets.mjs가 만든 파일)
export const CAT_SHEETS: Record<string, ImageSourcePropType> = {
  orange: require('../../../assets/pets/cat_orange.png'),
  white: require('../../../assets/pets/cat_white.png'),
  cream: require('../../../assets/pets/cat_cream.png'),
  gray: require('../../../assets/pets/cat_gray.png'),
  blue: require('../../../assets/pets/cat_blue.png'),
  mint: require('../../../assets/pets/cat_mint.png'),
  pink: require('../../../assets/pets/cat_pink.png'),
  rainbow: require('../../../assets/pets/cat_rainbow.png'),
};
export const PROPS_SHEET: ImageSourcePropType = require('../../../assets/pets/props.png');
export const BACKGROUND_TILE: ImageSourcePropType = require('../../../assets/pets/background_tile.png');
