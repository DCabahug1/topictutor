import { Button } from "@/components/almanac/Button";
import { shortTitle } from "@/components/almanac/SeriesRow";

type ContinueSeriesButtonProps = {
  seriesId: string;
  /** The series' full title. The button shows the part before the colon. */
  seriesTitle: string;
  /** The lesson it opens. */
  next: { number: number };
};

/**
 * The primary that picks a series back up, named so the learner knows where it goes:
 * Continue *“How a Web Page Gets Built”*. A long name wraps to even, centred lines; the
 * padding keeps wrapped lines off the edges (one line still sits at the 58px height) and
 * the arrow keeps its size. The label is one span, so the flex gap doesn't split it.
 */
export function ContinueSeriesButton({ seriesId, seriesTitle, next }: ContinueSeriesButtonProps) {
  return (
    <Button
      icon
      href={`/series/${seriesId}/${next.number}`}
      className="py-3 text-center [text-wrap:balance] [&>svg]:flex-none"
    >
      <span>
        Continue <em>“{shortTitle(seriesTitle)}”</em>
      </span>
    </Button>
  );
}
