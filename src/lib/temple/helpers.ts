import { HttpResponseError } from "@taquito/http-utils";
import { RpcClient } from "@taquito/rpc";
import { ValidationResult, validateAddress } from "@taquito/utils";
import BigNumber from "bignumber.js";
import memoize from "micro-memoize";

import { getMessage } from "lib/i18n";
import { IntercomError } from "lib/intercom/helpers";
import { ErrorType } from "lib/temple/beacon";
import rpcErrors from "lib/temple/rpcErrors";

export const loadChainId = memoize(fetchChainId, {
  isPromise: true,
  maxSize: 100,
});

export function fetchChainId(rpcUrl: string) {
  const rpc = new RpcClient(rpcUrl);
  return rpc.getChainId();
}

export function hasManager(manager: any) {
  return manager && typeof manager === "object" ? !!manager.key : !!manager;
}

export function tzToMutez(tz: any) {
  const bigNum = new BigNumber(tz);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.times(10 ** 6).integerValue();
}

export function mutezToTz(mutez: any) {
  const bigNum = new BigNumber(mutez);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.integerValue().div(10 ** 6);
}

export function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isKTAddress(address: string) {
  return address?.startsWith("KT");
}

export function validateDerivationPath(p: string) {
  if (!p.startsWith("m")) {
    return getMessage("derivationPathMustStartWithM");
  }
  if (p.length > 1 && p[1] !== "/") {
    return getMessage("derivationSeparatorMustBeSlash");
  }

  const parts = p.replace("m", "").split("/").filter(Boolean);
  if (
    !parts.every((p) => {
      const pNum = +(p.includes("'") ? p.replace("'", "") : p);
      return Number.isSafeInteger(pNum) && pNum >= 0;
    })
  ) {
    return getMessage("invalidPath");
  }

  return true;
}

export function validateContractAddress(value: any) {
  switch (false) {
    case isAddressValid(value):
      return getMessage("invalidAddress");

    case isKTAddress(value):
      return getMessage("onlyKTContractAddressAllowed");

    default:
      return true;
  }
}

export function getRpcErrorDetails(error: HttpResponseError) {
  try {
    const errorDetails = JSON.parse(error.body)?.[0];
    if (
      typeof errorDetails !== "object" ||
      typeof errorDetails.id !== "string"
    ) {
      throw new Error();
    }
    return errorDetails;
  } catch {
    throw new Error("Not a JSON RPC error response");
  }
}

function getRpcErrorEntry(error: HttpResponseError) {
  try {
    const errorDetails = getRpcErrorDetails(error);
    const matchingPostfix = Object.keys(rpcErrors).find((postfix) =>
      errorDetails.id.endsWith(postfix)
    );
    if (!matchingPostfix) {
      return undefined;
    }
    return rpcErrors[matchingPostfix];
  } catch {
    throw new Error("Not a JSON RPC error response");
  }
}

export function getBeaconErrorType(error: HttpResponseError) {
  try {
    const rpcErrorEntry = getRpcErrorEntry(error);
    return rpcErrorEntry?.beaconError || ErrorType.TRANSACTION_INVALID_ERROR;
  } catch {
    return ErrorType.UNKNOWN_ERROR;
  }
}

export function formatOpParamsBeforeSend(params: any) {
  if (params.kind === "origination" && params.script) {
    const newParams = { ...params, ...params.script };
    newParams.init = newParams.storage;
    delete newParams.script;
    delete newParams.storage;
    return newParams;
  }
  return params;
}

export function transformHttpResponseError(err: HttpResponseError) {
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(err.body);
  } catch {
    throw new Error(getMessage("unknownErrorFromRPC", err.url));
  }

  try {
    const firstTezError = parsedBody[0];
    const matchingPostfix = Object.keys(KNOWN_TEZ_ERRORS).find((idPostfix) =>
      firstTezError?.id?.endsWith(idPostfix)
    );
    const message = matchingPostfix
      ? KNOWN_TEZ_ERRORS[matchingPostfix]
      : err.message;
    return new IntercomError(message, parsedBody);
  } catch {
    throw err;
  }
}

const KNOWN_TEZ_ERRORS: Record<string, string> = {
  "implicit.empty_implicit_contract": getMessage("emptyImplicitContract"),
  "contract.balance_too_low": getMessage("balanceTooLow"),
};
