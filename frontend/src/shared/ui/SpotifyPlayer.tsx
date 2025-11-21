import React from 'react';

interface SpotifyPlayerProps {
    trackId: string;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ trackId }) => {
    return (
        <iframe
            src={`https://open.spotify.com/embed/track/${trackId}`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="encrypted-media"
            className="rounded-lg"
        ></iframe>
    );
};

export default SpotifyPlayer;
