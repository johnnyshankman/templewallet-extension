import React, { FC, useMemo } from "react";

import classNames from "clsx";

import { ReactComponent as ArrowRightTopIcon } from "app/icons/arrow-right-top.svg";
import useTippy from "lib/ui/useTippy";

type OpenInExplorerChipProps = {
  baseUrl: string;
  opHash: string;
  className?: string;
};

const OpenInExplorerChip: FC<OpenInExplorerChipProps> = ({
  baseUrl,
  opHash,
  className,
}) => {
  const tippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: "View on block explorer",
      animation: "shift-away-subtle",
    }),
    []
  );

  const ref = useTippy<HTMLAnchorElement>(tippyProps);

  return (
    <a
      ref={ref}
      href={`${baseUrl}/${opHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames(
        "bg-gray-100 hover:bg-gray-200",
        "rounded-sm shadow-xs",
        "text-xs p-1",
        "text-gray-600 leading-none select-none",
        "transition ease-in-out duration-300",
        "flex items-center",
        className
      )}
    >
      <ArrowRightTopIcon className="w-auto h-3 stroke-current stroke-2" />
    </a>
  );
};

export default OpenInExplorerChip;
