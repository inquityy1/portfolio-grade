export const QUEUE_POST_PREVIEW = 'post-preview';
export const QUEUE_TAG_STATS = 'tag-stats';

export type TagStatsJob = {
    orgId: string;
};

export type PostPreviewJob = {
    orgId: string;
    postId: string;
};