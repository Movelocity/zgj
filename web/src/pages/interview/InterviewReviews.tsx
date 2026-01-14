/**
 * Interview Reviews Wrapper Component
 * 
 * Routes to detail page based on query parameter:
 * - No `id` param: Creation mode (new review workflow)
 * - With `id` param: View mode (existing review details)
 * 
 * The list view is now at /interview route instead.
 */

import InterviewReviewDetail from './InterviewReviewDetail';

export const InterviewReviews: React.FC = () => {
  // Always render detail component
  // Mode detection (creation vs view) happens inside InterviewReviewDetail
  // based on whether `id` query parameter is present
  return <InterviewReviewDetail />;
};

export default InterviewReviews;
