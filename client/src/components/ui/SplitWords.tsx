import React from 'react';

/**
 * Tách text thành từng từ để GSAP animate (.split-word).
 * Nội dung vẫn là text thường trong DOM — tốt cho SEO.
 */
export const SplitWords: React.FC<{ text: string; innerClassName?: string }> = ({
    text,
    innerClassName = '',
}) => (
    <>
        {text.split(' ').map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap overflow-visible">
                <span className={`inline-block pb-[0.28em] -mb-[0.28em] pt-[0.1em] -mt-[0.1em] overflow-visible ${innerClassName}`}>
                    {word.split('').map((char, cIdx) => (
                        <span key={cIdx} className="split-char inline-block opacity-0">
                            {char}
                        </span>
                    ))}
                </span>
                <span className="inline-block">&nbsp;</span>
            </span>
        ))}
    </>
);

interface SectionHeadingProps {
    id: string;
    title: string;
    desc?: string;
    dark?: boolean;
    center?: boolean;
}

/**
 * Section heading với split-word animation support.
 * Thêm `data-split` trên h2 để GSAP tự animate.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
    id,
    title,
    desc,
    dark = false,
    center = true,
}) => (
    <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
        <h2
            id={id}
            data-split
            className={`text-3xl font-black leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl ${dark ? 'text-white' : 'text-gray-950'
                }`}
        >
            <SplitWords text={title} />
        </h2>
        {desc && (
            <p
                data-reveal="up"
                className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? 'text-blue-100/80' : 'text-gray-600'
                    }`}
            >
                {desc}
            </p>
        )}
    </div>
);

export default SplitWords;
