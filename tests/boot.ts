import * as Rx from "rx";
/**
 * Shared boot logic for all tests
 */

// Enable RX debugging
(Rx.config as any).longStackSupport = true;

export {
    Rx
}
