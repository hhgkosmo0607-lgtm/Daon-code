import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { DEFAULT_PET_ID } from '../domain/petCatalog';
import { ART_SCALE, CELL_H } from '../domain/petSheet';
import { PET_PORTRAITS } from './petAssets';

/** 초상화 폭(도트) — scripts/build-pet-assets.mjs의 PORTRAIT와 같아야 한다 */
export const PORTRAIT_W = 30;

/**
 * 상점·보유 목록에 쓰는 펫 정지 그림 (서 있는 첫 프레임).
 * 펫을 한꺼번에 많이 보여주는 화면이라 시트 전체 대신 작은 초상화 파일을 쓴다.
 */
export function PetPortrait({
  petId,
  pixel = ART_SCALE,
  style,
}: {
  petId: string;
  /** 도트 한 칸 크기 (dp). 작게 쓸 땐 1 */
  pixel?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={PET_PORTRAITS[petId] ?? PET_PORTRAITS[DEFAULT_PET_ID]}
      fadeDuration={0}
      style={[{ width: PORTRAIT_W * pixel, height: CELL_H * pixel }, style]}
    />
  );
}
