import { safeDecrypt } from "../utils/cypto.js";
import api from "./axios.js";
import qs from "qs";
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
      }
    )
    .then(({ data }) => data);
}

export async function getSelfWeekPrograms(token, weekStartDate) {
  return api.get(`/rest/reservations/programs/v2?selfId=1&weekStartDate=${weekStartDate}`, {
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
      }
    )
    .then(({ data }) => data);
}

export async function getAllReservation(username, password, access_token) {
  username = safeDecrypt(username);
  password = safeDecrypt(password);
  return api
    .get(
      `/rest/reserves?weekStartDate=2026-01-03+00:00:00&selfType=NORMAL`,
      qs.stringify({
        grant_type: "password",
        username,
        password,
      }),
      {
        headers: {
          authorization: `Bearer ${access_token}`,
        },
      }
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
