import styles from './StarryBackground.module.css';

/**
 * CSS だけで作る軽量な星空背景。
 * - 3 つの密度違いレイヤーを box-shadow で散らし、ゆっくりスクロールさせる
 * - 流れ星 2 本
 * - 上空にオーロラのようなグラデを敷く
 * - prefers-reduced-motion 対応はモジュール CSS 側で実施
 */
export function StarryBackground() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.aurora} />
      <div className={`${styles.stars} ${styles.layerSmall}`} />
      <div className={`${styles.stars} ${styles.layerMedium}`} />
      <div className={`${styles.stars} ${styles.layerLarge}`} />
      <div className={styles.shootingStar} />
      <div className={`${styles.shootingStar} ${styles.shootingStar2}`} />
    </div>
  );
}
