import { getProgramByFoodName } from "../utils/index.js";
import api from "./axios.js";
import qs from "qs";
export async function loginUser(username, password) {
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

export async function getSelfWeekPrograms(access_token) {
  return api
    .get(`/rest/reservations/programs/v2?selfId=1&weekStartDate=2026-01-03+00:00:00`, {
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    })
    .then(({ data }) => data?.payload?.selfWeekPrograms);
}

export async function reserveFood(user, foodName) {
  const selfWeekPrograms = await getSelfWeekPrograms(user.access_token);
  const program = await getProgramByFoodName(selfWeekPrograms, foodName);

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
