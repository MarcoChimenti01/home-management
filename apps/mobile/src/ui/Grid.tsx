import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { containerMax, ORDERED_BREAKPOINTS, useBreakpoint, type Breakpoint } from './theme';

// .container: larghezza massima per breakpoint, centrata
export function Container({ children, fluid, style }: { children: ReactNode; fluid?: boolean; style?: StyleProp<ViewStyle> }) {
  const { bp } = useBreakpoint();
  const max = fluid || bp === 'xs' ? undefined : containerMax[bp];
  return (
    <View style={[{ width: '100%', alignSelf: 'center', maxWidth: max, paddingHorizontal: 12 }, style]}>
      {children}
    </View>
  );
}

// .row: contenitore flessibile con "gutter" fra le colonne
export function Row({ children, gutter = 16, style }: { children: ReactNode; gutter?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gutter / 2 }, style]}>
      {Children.map(children, (child) =>
        isValidElement(child) ? cloneElement(child as ReactElement<{ gutter?: number }>, { gutter }) : child,
      )}
    </View>
  );
}

type ColProps = {
  children: ReactNode;
  // numero di colonne su 12 da quel breakpoint in su (xs = sempre)
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  gutter?: number;
  style?: StyleProp<ViewStyle>;
};

// .col-{bp}-{n}: sotto il primo breakpoint definito la colonna occupa tutta la riga
export function Col({ children, xs = 12, sm, md, lg, xl, gutter = 16, style }: ColProps) {
  const { bp } = useBreakpoint();
  const spans: Record<Breakpoint, number | undefined> = { xs, sm, md, lg, xl };

  let span = xs;
  for (const name of ORDERED_BREAKPOINTS) {
    const v = spans[name];
    if (v !== undefined) span = v;
    if (name === bp) break;
  }

  return (
    <View style={[{ width: `${(span / 12) * 100}%`, paddingHorizontal: gutter / 2, marginBottom: gutter }, style]}>
      {children}
    </View>
  );
}
