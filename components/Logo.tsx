import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

const Logo = () => {
  return (
    <View className="rounded-full bg-white p-2">
      <Svg viewBox="0 0 60 60" width="60" height="60">
        <G transform="translate(30, 30)">
          <Path d="M-15 0 L0 -15 L12 -12 L15 0 L0 15 L-15 0 Z" fill="#000000" stroke="none" />

          <Path d="M8 -8 L12 -12 L15 0 L8 -8 Z" fill="#ffffff" />

          <Circle cx="0" cy="0" r="2" fill="#ffffff" />
        </G>
      </Svg>
    </View>
  );
};

export default Logo;
