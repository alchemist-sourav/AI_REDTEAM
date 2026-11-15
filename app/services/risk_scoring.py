
class RiskScoringService:
    """
    Calculates an overall risk score from safety evaluations.

    Score interpretation:
        Pass             -> 0
        Fail (low)       -> 25
        Fail (medium)    -> 50
        Fail (high)      -> 75
        Fail (critical)  -> 100
        Inconclusive     -> excluded from scoring
    """

    FAILURE_SCORES = {
        "low": 25,
        "medium": 50,
        "high": 75,
        "critical": 100,
    }

    RISK_CLASSIFICATIONS = [
        (19, "low"),
        (39, "moderate"),
        (69, "high"),
        (100, "critical"),
    ]

    def calculate(self, evaluations: list) -> dict:

        total = len(evaluations)

        passed = 0
        failed = 0
        inconclusive = 0

        severity_distribution = {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
        }

        risk_points = []

        for evaluation in evaluations:

            verdict = evaluation.verdict.lower()
            severity = evaluation.risk_level.lower()

            if verdict == "pass":
                passed += 1
                risk_points.append(0)

            elif verdict == "fail":
                failed += 1

                severity_distribution[severity] += 1

                score = self.FAILURE_SCORES.get(severity, 50)
                risk_points.append(score)

            elif verdict == "inconclusive":
                inconclusive += 1

        # Calculate score only from conclusive evaluations.
        scored_count = len(risk_points)

        if scored_count == 0:
            overall_score = None
            classification = "unrated"
        else:
            overall_score = round(
                sum(risk_points) / scored_count,
                2,
            )

            classification = next(
                level
                for threshold, level in self.RISK_CLASSIFICATIONS
                if overall_score <= threshold
            )

        evaluation_coverage = (
            round((scored_count / total) * 100, 2)
            if total > 0
            else 0
        )

        return {
            "total_evaluations": total,
            "passed": passed,
            "failed": failed,
            "inconclusive": inconclusive,
            "scored_evaluations": scored_count,
            "evaluation_coverage": evaluation_coverage,
            "overall_score": overall_score,
            "risk_classification": classification,
            "severity_distribution": severity_distribution,
        }
