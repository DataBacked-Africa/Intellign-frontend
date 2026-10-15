'use client';

import { NyscReplay } from '../NyscReplay';
import { bundle } from '../data/bundle';

export default function NyscWorkspacePage() {
  return <NyscReplay bundle={bundle} backHref="/demo/nysc-deployment" />;
}
