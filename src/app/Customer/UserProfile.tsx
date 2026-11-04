import CustomerNavbar from "../../components/CustomerNavbar";
import ProfileView from "../../components/ProfileView";

export default function ProfileUser() {
  return <ProfileView navbar={<CustomerNavbar />} />;
}
