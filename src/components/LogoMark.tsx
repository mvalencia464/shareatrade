import { useState } from "react";
import { wordmark } from "./QuickLinks";

type LogoMarkProps = {
  name: string;
  logoUrl?: string;
  className?: string;
};

export function LogoMark({ name, logoUrl, className = "" }: LogoMarkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !failed;
  const classes = ["logo-mark", className].filter(Boolean).join(" ");

  if (showImage && logoUrl) {
    return (
      <img
        className={classes}
        src={logoUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${classes} wordmark`.trim()} aria-hidden>
      {wordmark(name)}
    </div>
  );
}
