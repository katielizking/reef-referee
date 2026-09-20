import { createFileRoute } from "@tanstack/react-router";
import { CommunityLayout, PostComposer } from "@/components/Community";
export const Route = createFileRoute("/community/new")({
  head: () => ({
    meta: [
      { title: "Create a community post | FishTankr" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CommunityLayout>
      <PostComposer />
    </CommunityLayout>
  ),
});
