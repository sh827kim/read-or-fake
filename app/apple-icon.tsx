import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 180,
    height: 180,
};
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 100,
                    background: '#4F46E5', // Indigo-600
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '36px', // iOS 스타일 둥근 모서리 (실제로는 기기가 깎지만 미리 보기용)
                }}
            >
                📖
            </div>
        ),
        {
            ...size,
        }
    );
}
