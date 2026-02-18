import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = '읽긴했니? — 독후감 진위 검증 서비스';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 100,
                    background: 'linear-gradient(to bottom right, #4F46E5, #9333EA)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                }}
            >
                <div style={{ fontSize: 180, marginBottom: 20 }}>📖</div>
                <div style={{ fontWeight: 800 }}>읽긴했니?</div>
                <div style={{ fontSize: 40, marginTop: 20, fontWeight: 400, opacity: 0.9 }}>
                    독후감 진위 검증 서비스
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
