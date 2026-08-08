import { useState } from "react";
import { wordmark } from "./QuickLinks";

type CoverImageProps = {
  name: string;
  imageUrl?: string;
};

export function CoverImage({ name, imageUrl }: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  if (showImage && imageUrl) {
    return (
      <img
        className="detail-cover"
        src={imageUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="detail-cover placeholder" aria-hidden>
      {wordmark(name)}
    </div>
  );
}
