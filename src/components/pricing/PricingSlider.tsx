
import { Slider } from "@/components/ui/slider";

interface PricingSliderProps {
  urlCount: number;
  setUrlCount: (value: number) => void;
}

const PricingSlider = ({ urlCount, setUrlCount }: PricingSliderProps) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="font-medium">Cars to monitor</span>
        <span className="font-bold">{urlCount} {urlCount === 1 ? 'Car' : 'Cars'}</span>
      </div>
      <Slider
        value={[urlCount]}
        min={1}
        max={250}
        step={1}
        onValueChange={([value]) => setUrlCount(value)}
        className="mb-6"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>250</span>
      </div>
    </div>
  );
};

export default PricingSlider;
