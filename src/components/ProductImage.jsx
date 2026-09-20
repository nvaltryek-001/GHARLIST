import { useState } from "react";
import { ImageOff } from "lucide-react";
import {
  getImageCandidates,
  getFallbackLabel
} from "../services/imageService.js";

export default function ProductImage({
  product,
  className = ""
}) {
  const candidates = getImageCandidates(product);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!candidates.length || failed) {
    return (
      <div
        className={`product-image-fallback ${className}`}
        aria-label={`${product?.name || "Product"} image unavailable`}
      >
        <ImageOff size={30} strokeWidth={1.7} />
        <span>{getFallbackLabel(product)}</span>
      </div>
    );
  }

  const src = candidates[index];

  return (
    <img
      src={src}
      alt={product?.name || "Product"}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex(index + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
