import { api } from "../lib/api";

export async function sendSupportChatMessage(message, history = []) {
  const response = await api.post("/api/support/chat", {
    message,
    history
  });
  return response.data;
}

export async function fetchSupportSuggestions() {
  const response = await api.get("/api/support/suggestions");
  return response.data;
}
