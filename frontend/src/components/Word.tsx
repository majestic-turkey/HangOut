export default function Word ({
    maskedWord,
    flashLetter,
    flashPulseId
}: {
    maskedWord: string;
    flashLetter: string | null;
    flashPulseId: number;
}) {
    const displayWord = maskedWord.split('')
        .map((char, index) => {
            const isHidden = char === '_';
            const isSpace = char === ' ';
            const shouldFlash = !!flashLetter && !isHidden && !isSpace && char.toLowerCase() === flashLetter;

            return (
            <span
                key={shouldFlash ? `${index}-${char}-${flashPulseId}` : `${index}-${char}`}
                className={`${isHidden ? 'hidden-letter' : 'revealed-letter'} ${shouldFlash ? 'letter-flash' : ''}`.trim()}
            >
                {char}
            </span>
        )});

    return (
        <p className="word-display">Word: {displayWord}</p>
    )
}