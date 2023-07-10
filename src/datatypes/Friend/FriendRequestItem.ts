/**
 * Define Type of Received Friend List Item
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

export default interface FriendRequestItem {
  id: string;
  from: string;
  to: string;
  createdAt: Date | string;
}