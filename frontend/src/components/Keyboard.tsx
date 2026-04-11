import type {KeyboardProps} from '../types.ts'

export default function Keyboard({ guessedLetters, wrongLetters }: KeyboardProps) {
    const keys = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

    // Render keyboard keys
    const keyEls = keys.map(row => {
        return (
        <div key={row}>
            {row.split('').map(key => {
                const isGuessed = guessedLetters.has(key);
                const isWrong = wrongLetters.has(key);
                return (
                    <button key={key} disabled={isGuessed} className={`key ${isGuessed ? 'guessed-key' : ''} ${isWrong ? 'wrong-key' : ''}`}>
                        {key}
                    </button>
                );
            })}
        </div>
        );
    });

    return (
        <div>
            {keyEls}
        </div>
    );
}