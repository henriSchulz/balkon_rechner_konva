import React from 'react';
import { Layer, Group, Line, Text } from 'react-konva';

const ProfilesLayer = ({ showProfiles, profileData }) => {
  if (!showProfiles || profileData.profileDetails.length === 0) {
    return null;
  }

  return (
    <Layer>
      {profileData.profileDetails.map((profile, index) => (
        <Group key={`profile-${index}`}>
          {/* Vollständige Diele (hellgrau) */}
          <Line
            points={profile.full.flat()}
            closed={true}
            fill="rgba(200, 200, 200, 0.3)"
            stroke="#888"
            strokeWidth={1}
          />

          {/* Benötigter Teil (grün) */}
          <Line
            points={profile.used.flat()}
            closed={true}
            fill="rgba(34, 197, 94, 0.4)"
            stroke="#16a34a"
            strokeWidth={2}
          />

          {/* Längenangabe */}
          {(() => {
            const p1 = profile.used[0];
            const p2 = profile.used[1];
            const p3 = profile.used[2];
            const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
            const degrees = (angle * 180) / Math.PI;

            return (
              <Text
                x={(p1[0] + p3[0]) / 2}
                y={(p1[1] + p3[1]) / 2}
                text={`${profile.chosenLengthMM}mm`}
                fontSize={9}
                fill="#000"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                rotation={degrees}
                offsetX={15}
                offsetY={4.5}
              />
            );
          })()}
        </Group>
      ))}
    </Layer>
  );
};

export default ProfilesLayer;