import { ChatCircle, Heart, ShareNetwork, ThumbsUp } from "@phosphor-icons/react";
import { shareExampleLines } from "../lib/shareExample";

const ASK = {
  name: "Jess Moreno",
  photo: "https://randomuser.me/api/portraits/women/65.jpg",
};

const SHARE = {
  name: "Dana Whitaker",
  photo: "https://randomuser.me/api/portraits/men/32.jpg",
};

const THANKS = {
  name: "Claire Pell",
  photo: "https://randomuser.me/api/portraits/women/22.jpg",
};

export function ShareGroupMockup({ origin }: { origin?: string }) {
  const lines = shareExampleLines(origin);

  return (
    <figure className="share-thread">
      <figcaption className="share-thread-label">Spokane Valley neighbors</figcaption>
      <div className="share-thread-post">
        <img className="share-thread-avatar is-post" src={ASK.photo} alt="" width={44} height={44} />
        <div className="share-thread-col">
          <p className="share-thread-from">
            {ASK.name}
            <span className="share-thread-meta"> · 2h</span>
          </p>
          <p className="share-thread-copy">Anyone know a good electrician in the Valley?</p>
        </div>
      </div>
      <div className="share-thread-engage" aria-hidden="true">
        <p className="share-thread-stats">
          <span className="share-thread-reacts">
            <span className="share-thread-chip is-like">
              <ThumbsUp size={11} weight="fill" />
            </span>
            <span className="share-thread-chip is-heart">
              <Heart size={11} weight="fill" />
            </span>
          </span>
          14
          <span className="share-thread-stats-sep">·</span>
          4 comments
        </p>
        <div className="share-thread-actions">
          <span>
            <ThumbsUp size={16} /> Like
          </span>
          <span>
            <ChatCircle size={16} /> Comment
          </span>
          <span>
            <ShareNetwork size={16} /> Share
          </span>
        </div>
      </div>
      <div className="share-thread-comment">
        <img className="share-thread-avatar is-comment" src={SHARE.photo} alt="" width={32} height={32} />
        <div className="share-thread-col">
          <div className="share-thread-bubble">
            <p className="share-thread-from">{SHARE.name}</p>
            <pre className="share-thread-body">{lines.join("\n")}</pre>
          </div>
          <p className="share-thread-comment-meta">
            Like · Reply · 1h
            <span className="share-thread-likes">
              <ThumbsUp size={10} weight="fill" /> 8
            </span>
          </p>
        </div>
      </div>
      <div className="share-thread-comment">
        <img className="share-thread-avatar is-comment" src={THANKS.photo} alt="" width={32} height={32} />
        <div className="share-thread-col">
          <div className="share-thread-bubble">
            <p className="share-thread-from">{THANKS.name}</p>
            <p className="share-thread-thanks">Saving this—thank you</p>
          </div>
          <p className="share-thread-comment-meta">
            Like · Reply · 48m
            <span className="share-thread-likes">
              <ThumbsUp size={10} weight="fill" /> 3
            </span>
          </p>
        </div>
      </div>
    </figure>
  );
}
