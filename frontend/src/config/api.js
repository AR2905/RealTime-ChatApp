export const authHeaders = (user) => ({
  "Content-type": "application/json",
  authorization: `Bearer ${user?.token}`,
});

export const saveUser = (user) => {
  localStorage.setItem("userInfo", JSON.stringify(user));
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo"));
  } catch (e) {
    return null;
  }
};

export const clearUser = () => {
  localStorage.removeItem("userInfo");
};

export const ERROR_MSG = (err) =>
  err?.response?.data?.message || "Something went wrong. Please try again.";