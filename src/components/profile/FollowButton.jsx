// src/components/profile/FollowButton.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isFollowing, followUser, unfollowUser } from "@/lib/api/follows";
import { cn } from "@/lib/utils";

export default function FollowButton({ targetUserId, size = "md" }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: following } = useQuery({
    queryKey: ["following", user?.id, targetUserId],
    queryFn: () => isFollowing(user.id, targetUserId),
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      following
        ? unfollowUser(user.id, targetUserId)
        : followUser(user.id, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["following", user.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["profile", targetUserId] });
    },
  });

  if (!user || user.id === targetUserId) return null;

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={cn(
        size === "sm" ? "btn-ghost !px-3 !py-1.5 !text-xs" : "btn-brand",
        following &&
          "border border-border-dark bg-transparent text-text-primary hover:bg-surface-elevated",
        mutation.isPending && "opacity-60",
      )}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> Follow
        </>
      )}
    </button>
  );
}
