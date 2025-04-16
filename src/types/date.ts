/**
 * Interface for date formatting results
 */
export interface FormatDateResult {
  formattedResult: string;
  error?: {
    title: string;
    message: string;
  };
}
