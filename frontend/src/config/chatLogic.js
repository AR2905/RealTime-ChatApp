export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const isSameSenderMargin = (messages, m, i, userId) => {
  if (
    i < messages.length - 1 &&
    messages[i + 1].sender?._id === m.sender?._id &&
    messages[i].sender?._id !== userId
  )
    return 33;
  else if (
    (i < messages.length - 1 &&
      messages[i + 1].sender?._id !== m.sender?._id &&
      messages[i].sender?._id !== userId) ||
    (i === messages.length - 1 && messages[i].sender?._id !== userId)
  )
    return 0;
  else return "auto";
};

export const isSameSender = (messages, m, i, userId) => {
  return (
    i < messages.length - 1 &&
    (messages[i + 1].sender?._id !== m.sender?._id ||
      messages[i + 1].sender?._id === undefined) &&
    messages[i].sender?._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  return (
    i === messages.length - 1 &&
    messages[messages.length - 1].sender?._id !== userId &&
    messages[messages.length - 1].sender?._id
  );
};

export const isSameUser = (messages, m, i) => {
  return i > 0 && messages[i - 1].sender?._id === m.sender?._id;
};

export const getSender = (loggedUser, users) => {
  if (!users || !users.length) return "Unknown";
  if (users[0]?._id === loggedUser?._id) return users[1]?.name || "Unknown";
  return users[0]?.name || "Unknown";
};

export const getSenderFull = (loggedUser, users) => {
  if (!users || !users.length) return {};
  return users[0]?._id === loggedUser?._id ? users[1] : users[0];
};

export const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDay = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return "offline";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};