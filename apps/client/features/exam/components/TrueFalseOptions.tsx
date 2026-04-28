import React from 'react'; import MultipleChoiceOptions from './MultipleChoiceOptions';
export default function TrueFalseOptions(props: { value?: string; onChange: (v: string) => void }) { return <MultipleChoiceOptions choices={['Tosi', 'Epätosi']} {...props} />; }
