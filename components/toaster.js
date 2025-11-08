import Alert from "@mui/material/Alert";

export default function Toaster(props) {
  return (
    <Alert
      severity={props.type}
      sx={{
        backgroundColor:
          props.type === "success"
            ? "#D1FAE5" // light green
            : props.type === "error"
            ? "#FECACA" // light red
            : props.type === "warning"
            ? "#FEF3C7" // light yellow
            : "#D9AB83", // light blue (info)
        color: "black",
        fontWeight: 600,
      }}
    >
      {props.message}
    </Alert>
  );
}
