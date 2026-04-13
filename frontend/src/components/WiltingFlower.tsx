/**
 * Renders a flower whose petals fall off one by one as wrong guesses accumulate.
 * Total petals = maxAttempts. Petals remaining = attemptsLeft.
 */

interface WiltingFlowerProps {
    attemptsLeft: number;
    maxAttempts: number;
}

export default function WiltingFlower({ attemptsLeft, maxAttempts }: WiltingFlowerProps) {
    const cx = 100;
    const cy = 80;
    const petalRadius = 14;
    const orbitRadius = 30;

    const petals = Array.from({ length: maxAttempts }, (_, i) => {
        const angle = (2 * Math.PI * i) / maxAttempts - Math.PI / 2;
        const px = cx + orbitRadius * Math.cos(angle);
        const py = cy + orbitRadius * Math.sin(angle);
        // petals are lost from the last one backwards
        const alive = i < attemptsLeft;
        return { px, py, alive };
    });

    return (
        <svg
            viewBox="0 0 200 220"
            width="180"
            height="180"
            aria-label={`Flower with ${attemptsLeft} of ${maxAttempts} petals remaining`}
        >
            {/* Stem */}
            <line x1={cx} y1={cy + 14} x2={cx} y2="200" stroke="#4a7c3f" strokeWidth="5" strokeLinecap="round" />

            {/* Leaves */}
            <ellipse cx={cx - 16} cy="155" rx="14" ry="7" fill="#6aab5e" transform={`rotate(-30 ${cx - 16} 155)`} />
            <ellipse cx={cx + 16} cy="170" rx="14" ry="7" fill="#6aab5e" transform={`rotate(30 ${cx + 16} 170)`} />

            {/* Petals */}
            {petals.map(({ px, py, alive }, i) =>
                alive ? (
                    <ellipse
                        key={`${i}-alive`}
                        cx={px}
                        cy={py}
                        rx={petalRadius}
                        ry={petalRadius * 0.55}
                        fill="#f472b6"
                        stroke="#ec4899"
                        strokeWidth="1"
                        transform={`rotate(${(360 * i) / maxAttempts - 90} ${px} ${py})`}
                        opacity="0.92"
                    />
                ) : (
                    /* Wilted / fallen petal — animates downward on mount */
                    <ellipse
                        key={`${i}-fallen`}
                        cx={px}
                        cy={py}
                        rx={petalRadius * 0.7}
                        ry={petalRadius * 0.35}
                        fill="#f9a8d4"
                        stroke="#fbcfe8"
                        strokeWidth="1"
                        style={{ animation: 'petal-fall 0.6s ease-in forwards', transformOrigin: `${px}px ${py}px` }}
                    />
                )
            )}

            {/* Flower centre */}
            <circle cx={cx} cy={cy} r="14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="7" fill="#f59e0b" opacity="0.6" />
        </svg>
    );
}
