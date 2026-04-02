import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:!bg-[hsl(0,85%,12%)] group-[.toaster]:!border-[hsl(0,85%,35%)] group-[.toaster]:!text-[hsl(0,85%,75%)]",
          warning:
            "group-[.toaster]:!bg-[hsl(40,60%,12%)] group-[.toaster]:!border-[hsl(40,80%,35%)] group-[.toaster]:!text-[hsl(40,95%,70%)]",
          success:
            "group-[.toaster]:!bg-[hsl(145,40%,10%)] group-[.toaster]:!border-[hsl(145,60%,30%)] group-[.toaster]:!text-[hsl(145,80%,65%)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
