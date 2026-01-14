/**
 * Interview Reviews Wrapper Component
 * Routes between list and detail views based on query parameter
 */

import { useSearchParams } from 'react-router-dom';
import InterviewReviewList from './InterviewReviewList';
import InterviewReviewDetail from './InterviewReviewDetail';

export const InterviewReviews: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('id');

  // If no ID or ID is empty, show list view
  // Otherwise show detail view
  return reviewId ? <InterviewReviewDetail /> : <InterviewReviewList />;
};

export default InterviewReviews;
