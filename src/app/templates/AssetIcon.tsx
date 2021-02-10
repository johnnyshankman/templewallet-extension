import React from "react";
import { TempleAsset } from "lib/temple/types";
import { getAssetIconUrl } from "app/defaults";
import Identicon from "app/atoms/Identicon";

export type AssetIconProps = {
  asset: TempleAsset;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
};

const AssetIcon = React.memo((props: AssetIconProps) => {
  const { asset, className, style, size } = props;
  const assetIconUrl = getAssetIconUrl(asset);

  const [imageDisplayed, setImageDisplayed] = React.useState(true);
  const handleImageError = React.useCallback(() => {
    setImageDisplayed(false);
  }, [setImageDisplayed]);

  if (assetIconUrl && imageDisplayed) {
    return (
      <img
        src={assetIconUrl}
        alt={asset.name}
        className={className}
        style={{
          width: size,
          height: size,
          ...style,
        }}
        onError={handleImageError}
      />
    );
  }

  return (
    <Identicon
      type="initials"
      hash={asset.symbol}
      className={className}
      style={style}
      size={size}
    />
  );
});

export default AssetIcon;
