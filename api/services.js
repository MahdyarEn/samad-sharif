import { safeDecrypt } from "../utils/cypto.js";
import api from "./axios.js";
import qs from "qs";

export function isInvalidToken(data) {
  return data?.error === "invalid_token" || data?.error_description === "Invalid access token";
}

export function isBadCredentials(data) {
  return data?.error === "invalid_grant" && data?.error_description === "Bad credentials";
}

export async function loginUser(username, password) {
  username = safeDecrypt(username);
  password = safeDecrypt(password);
  return api
    .post(
      `/oauth/token`,
      qs.stringify({
        grant_type: "password",
        username,
        password,
      }),
      {
        headers: {
          authorization: "Basic c2FtYWQtbW9iaWxlOnNhbWFkLW1vYmlsZS1zZWNyZXQ=",
        },
      },
    )
    .then(({ data }) => data);
}

export async function getSelfWeekPrograms(token, weekStartDate, selfId = 1) {
  return api.get(`/rest/reservations/programs/v2?selfId=${selfId}&weekStartDate=${weekStartDate}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });
}

export async function reserveFood(user, program) {
  return api
    .put(
      `/rest/reserves/${program.programId}/reserve`,
      {
        foodTypeId: program.foodTypeId,
        mealTypeId: program.mealTypeId,
        selectedCount: 1,
        freeFoodSelected: false,
        selected: true,
      },
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          "Content-Type": "application/json",
        },
      },
    )
    .then(({ data }) => data);
}

export async function fetchUserProfile(access_token) {
  return api
    .get(`/rest/users/nurture-profiles`, {
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    })
    .then(({ data }) => data);
}
