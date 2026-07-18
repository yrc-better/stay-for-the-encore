import {
  createFeedbackHandler,
  type FeedbackEnv,
} from "./feedback";

interface Env extends FeedbackEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const handleFeedbackRequest = createFeedbackHandler();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/api/feedback") {
      return handleFeedbackRequest(request, env satisfies FeedbackEnv);
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("text/html")) {
      return response;
    }

    const siteUrl = new URL("/", requestUrl).href;
    const socialImageUrl = new URL("/og.png", requestUrl).href;
    const html = (await response.text())
      .replaceAll("__SITE_URL__", siteUrl)
      .replaceAll("__OG_IMAGE_URL__", socialImageUrl);

    return new Response(html, response);
  },
};
