import React from 'react';
import { createRoot } from 'react-dom/client';
import { NyscReplay } from '../src/app/demo/nysc-deployment/NyscReplay';
import { bundle } from '../src/app/demo/nysc-deployment/data/bundle';

createRoot(document.getElementById('root')!).render(<NyscReplay bundle={bundle} />);
