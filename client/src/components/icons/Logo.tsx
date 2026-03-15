import logo from "../../assets/logo.svg";

export const Logo = ({ className }: { className?: string }) => {
	return <img src={logo} alt="UrbanPulse" className={className} />;
};
