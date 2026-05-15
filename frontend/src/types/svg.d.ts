// Declaración de módulos para archivos SVG —
// permite importarlos como componentes React: import Logo from './logo.svg'
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
