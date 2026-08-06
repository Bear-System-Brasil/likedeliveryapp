import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OptionalsList } from "../customize-order";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type Props = {
  data: OptionalsList;
  changePrice: (add: boolean, value: number) => void;
  salePrice: number;
};

export function SelectOptions({ data, changePrice, salePrice }: Props) {
  const [selectedSizePrice, setSelectedSizePrice] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const toggleExtra = (label: string, price: number, checked: boolean) => {
    setSelectedExtras((prev) =>
      checked ? [...prev, label] : prev.filter((item) => item !== label),
    );

    changePrice(checked, price);
  };

  return (
    <div>
      <AccordionItem value={data.label}>
        <AccordionTrigger className="text-lg font-bold text-gray-900 ">
          {data.label}
        </AccordionTrigger>

        <RadioGroup
          defaultValue={data.options[0].label}
          onValueChange={(value) => {
            const selected = data.options.find((o) => o.label === value);
            if (!selected) return;

            changePrice(false, selectedSizePrice);
            changePrice(true, selected.price);
            setSelectedSizePrice(selected.price);
          }}
        >
          {data.value === "size" && (
            <div>
              {data.options.map((option) => (
                <AccordionContent key={option.label}>
                  <Label
                    htmlFor={option.label}
                    className="flex items-center justify-between border-2 border-gray-200 rounded-xl p-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id={option.label} value={option.label} />
                      <span>{option.label}</span>
                    </div>

                    <span>
                      {option.isBase
                        ? `R$${salePrice.toFixed(2)}`
                        : option.price > 0 && `+ R$${option.price.toFixed(2)}`}
                    </span>
                  </Label>
                </AccordionContent>
              ))}
            </div>
          )}

          <div>
            {data.value === "extra-ingredients" && (
              <div>
                {data.options.map((option, key) => (
                  <div key={key}>
                    <AccordionContent>
                      <Label
                        htmlFor={option.label}
                        className="flex items-center justify-between border-2 border-gray-200 rounded-xl p-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedExtras.includes(option.label)}
                            onCheckedChange={(val) =>
                              toggleExtra(
                                option.label,
                                option.price,
                                val as boolean,
                              )
                            }
                            id={option.label}
                          />
                          <span>{option.label}</span>
                        </div>

                        <span>
                          {option.price === 0
                            ? "Grátis"
                            : `+ R$${option.price.toFixed(2)}`}
                        </span>
                      </Label>
                    </AccordionContent>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RadioGroup>
      </AccordionItem>
    </div>
  );
}
