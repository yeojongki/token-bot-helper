import { utils } from "ethers"
import { PollOptions } from "ethers/lib/utils"

/**
 * 轮训执行函数 若结果为 undefined 以外的值则会重新执行
 * @param func
 * @param options
 * @returns
 */
export function withPoll(
  func: () => Promise<boolean | undefined>,
  options: PollOptions,
): Promise<boolean | undefined> {
  const wrappedFunc = () =>
    new Promise<boolean | undefined>(async (resolve, reject) => {
      try {
        const result = await func()

        if (result) {
          resolve(true)
        } else {
          // 结果为 falsy 值则 resolve undefined 使之继续执行
          resolve(undefined)
        }
      } catch (error) {
        resolve(undefined)
      }
    })

  return utils.poll(wrappedFunc, options)
}
