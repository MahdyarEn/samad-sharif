import { safeDecrypt } from "../utils/cypto.js";
import api from "./axios.js";
import qs from "qs";

export function isInvalidToken(data) {
  return data?.error === "invalid_token" || data?.error_description === "Invalid access token";
}

export function isBadCredentials(data) {
  return data?.error === "invalid_grant" && data?.error_description === "Bad credentials";
}

export function isInvalidCaptcha(data) {
  return data?.messageResource === "CAPTCHA_IS_INVALID";
}

const CLIENT_AUTH = "Basic c2FtYWQtbW9iaWxlOnNhbWFkLW1vYmlsZS1zZWNyZXQ=";

export async function loginUser(username, password, captcha) {
  username = safeDecrypt(username);
  password = safeDecrypt(password);
  return api
    .post(
      `/oauth/token`,
      qs.stringify({
        grant_type: "password",
        username,
        password,
        ...(captcha && { captchaText: captcha.text, validation: captcha.validation, nonce: captcha.nonce }),
      }),
      {
        headers: {
          authorization: CLIENT_AUTH,
        },
      },
    )
    .then(({ data }) => data);
}

export async function refreshSession(refreshToken) {
  return api
    .post(`/oauth/token`, qs.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }), {
      headers: {
        authorization: CLIENT_AUTH,
      },
    })
    .then(({ data }) => data);
}

export async function fetchCaptcha(nonce) {
  return api
    .post(`/rest/captcha`, { nonce }, { headers: { "Content-Type": "application/json" } })
    .then(({ data }) => data?.payload);
}

export async function getSelfWeekPrograms(token, weekStartDate, selfId = 1, options = {}) {
  return api.get(`/rest/reservations/programs/v2?selfId=${selfId}&weekStartDate=${weekStartDate}`, {
    ...options,
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

export async function fetchUserReserves(token, weekStartDate) {
  return api.get(`/rest/reserves?weekStartDate=${weekStartDate}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });
}

export async function fetchForgetCardCode(token, reserveId, count = 1) {
  return api.get(`/rest/forget-card-codes/print?reserveId=${reserveId}&count=${count}&dailySale=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });
}
