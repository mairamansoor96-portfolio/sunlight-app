import { TONE_STEPS, toneStrip, greyForLStar } from "@/lib/toneStrip";
import type { AppliedCondition } from "@/lib/simulations";

interface Props {
  stack: readonly AppliedCondition[];
  conditionName: string;
}

const round = (n: number) => Math.round(n);

/**
 * Eleven greys run through the current condition. Shows, as data, which tones
 * the condition has made indistinguishable.
 */
export function ToneStrip({ stack, conditionName }: Props) {
  const { after, merged } = toneStrip(stack);
  const pairs = merged.flatMap((m, i) => (m ? [`${TONE_STEPS[i - 1]} and ${TONE_STEPS[i]}`] : []));
  const changesGreys = after.some((L, i) => Math.abs(L - TONE_STEPS[i]) > 1);

  const summary =
    pairs.length > 0 ? (
      <>
        <strong>
          {pairs.length} of 10 steps merged.
        </strong>{" "}
        Tones at L* {pairs.join(", ")} can no longer be told apart.
      </>
    ) : changesGreys ? (
      "No steps merged at this strength."
    ) : (
      `Flat greys pass through unchanged. ${conditionName} changes edges or hues instead, so look at the image.`
    );

  const cells = (values: readonly number[], showMerged: boolean) =>
    values.map((L, i) => {
      const g = greyForLStar(L);
      return (
        <span
          key={i}
          className={`tone__cell${showMerged && merged[i] ? " is-merged" : ""}`}
          style={{ backgroundColor: `rgb(${g} ${g} ${g})` }}
        />
      );
    });

  return (
    <figure className="tone">
      <div
        className="tone__grid"
        role="img"
        aria-label={`Tone strip. Eleven greys from L* 0 to 100 become ${after.map(round).join(", ")} under ${conditionName}.`}
      >
        <span className="tone__rowlabel">Monitor</span>
        {cells(TONE_STEPS, false)}
        <span className="tone__rowlabel">Condition</span>
        {cells(after, true)}
        <span />
        {after.map((L, i) => (
          <span key={i} className="tone__axis">
            {round(L)}
          </span>
        ))}
      </div>
      <figcaption className="tone__caption">
        <span className="label">Tone strip · L*</span>
        <span className="tone__summary">{summary}</span>
        {pairs.length > 0 && (
          <span className="tone__key">
            <i aria-hidden="true" />
            Merged with its neighbour
          </span>
        )}
      </figcaption>
    </figure>
  );
}
